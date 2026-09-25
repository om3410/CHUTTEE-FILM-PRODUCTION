from rest_framework import permissions


class IsCrewMember(permissions.BasePermission):
    """Only CREW, ADMIN, or superusers can access."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return getattr(request.user, 'role', None) in ('CREW', 'ADMIN')


class IsCrewOrReadOnly(permissions.BasePermission):
    """Anyone authenticated can read. CREW, ADMIN, or superusers can write."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user.is_superuser:
            return True
        return getattr(request.user, 'role', None) in ('CREW', 'ADMIN')