from rest_framework.permissions import BasePermission

class IsPremiumUser(BasePermission):
  def has_permission(self, request, view):
    if not request.user.is_authenticated:
      return False
    sub = getattr(request.user, 'subscription', None)
    return bool(sub and sub.status == 'active')