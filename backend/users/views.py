from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from rest_framework import status
from users.serializers import UserSignupSerializer, LoginSerializer


class UserSignupView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = UserSignupSerializer(data=request.data)
        if serializer.is_valid():
            try:
                serializer.save()
                return Response({
                    'message': 'User created successfully. Please log in.'
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({
                    'message': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response({
                'message': 'Username already exists.'
        }, status=status.HTTP_400_BAD_REQUEST)


class UserLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data["username"]
            password = serializer.validated_data["password"]
            user = authenticate(username=username, password=password)
            if user:
                # Get or create a token for the user
                token, created = Token.objects.get_or_create(user=user)
                return Response({
                    "status": status.HTTP_200_OK,
                    "message": "Login successful",
                    "data": {
                        "token": token.key,
                        "user_id": user.id,
                        "username": user.username
                    }
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "status": status.HTTP_401_UNAUTHORIZED,
                    "message": "Invalid username or password",
                }, status=status.HTTP_401_UNAUTHORIZED)
        return Response({
            "status": status.HTTP_400_BAD_REQUEST,
            "message": "Bad request",
            "data": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)