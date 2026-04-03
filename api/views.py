from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import Category, Product, Purchase, User
from .serializers import CategorySerializer, ProductSerializer, PurchaseSerializer, UserSerializer

def index(request):
    return render(request, 'index.html')

@method_decorator(csrf_exempt, name='dispatch')
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            return Response({
                'id': user.id, 
                'username': user.username, 
                'email': user.email,
                'phone': user.phone or ''
            })
        return Response({'error': 'Неверный логин или пароль'}, status=400)

@method_decorator(csrf_exempt, name='dispatch')
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

@method_decorator(csrf_exempt, name='dispatch')
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_available=True)
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category', None)
        if category and category != 'all':
            queryset = queryset.filter(category__slug=category)
        return queryset

@method_decorator(csrf_exempt, name='dispatch')
class PurchaseViewSet(viewsets.ModelViewSet):
    serializer_class = PurchaseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Purchase.objects.filter(user=self.request.user)
    
    def create(self, request):
        try:
            product_id = request.data.get('product')
            payment_method = request.data.get('payment_method')
            product = Product.objects.get(id=product_id)
            purchase = Purchase.objects.create(
                user=request.user,
                product=product,
                payment_method=payment_method,
                amount=product.price
            )
            serializer = PurchaseSerializer(purchase)
            return Response(serializer.data, status=201)
        except Exception as e:
            return Response({'error': str(e)}, status=400)