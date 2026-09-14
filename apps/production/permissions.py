from rest_framework import permissions

class IsCrewMember(permissions.BasePermission):
  """Only allows Crew Members to perform any action."""
  def has_permission(self, request, view):
    return bool(request.user and request.user.is_authenticated and request.user.role == 'CREW')

class IsCrewOrReadOnly(permissions.BasePermission):
  """Crew Members can edit. General Users can only view (GET, HEAD, OPTIONS)."""
  def has_permission(self, request, view):
    if request.method in permissions.SAFE_METHODS:
      return True
    return bool(request.user and request.user.is_authenticated and request.user.role == 'CREW')