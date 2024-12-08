from django.urls import path

from views import UserLoginView, UserSignupView


urlpatterns = [
    path("signup/", UserSignupView.as_view(), name="sign-up"),
    path("login/", UserLoginView.as_view(), name="log-in"),
]
