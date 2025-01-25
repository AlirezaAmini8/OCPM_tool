"""
URL configuration for ocel_mining_tool project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path

from users.views import UserLoginView, UserSignupView
from process_mining.views import UploadOCELFileView, ApplyFilterView, UserFilesView, RetrieveFileView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('upload/', UploadOCELFileView.as_view(), name='upload-ocel-file'),
    path("signup/", UserSignupView.as_view(), name="sign-up"),
    path("login/", UserLoginView.as_view(), name="log-in"),
    path("filters/", ApplyFilterView.as_view(), name="filtering"),
    path('api/user-files/', UserFilesView.as_view(), name='user-files'),
    path('api/files/<int:file_id>/', RetrieveFileView.as_view(), name='retrieve-file'),
    path('api/files/<int:file_id>/', RetrieveFileView.as_view(), name='file-detail'),
]

