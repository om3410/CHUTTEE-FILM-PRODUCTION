from rest_framework import permissions


class IsCrewMember(permissions.BasePermission):
    """Only CREW or ADMIN can access."""
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) in ('CREW', 'ADMIN')
        )


class IsCrewOrReadOnly(permissions.BasePermission):
    """Anyone authenticated can read. Only CREW or ADMIN can write."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return getattr(request.user, 'role', None) in ('CREW', 'ADMIN')