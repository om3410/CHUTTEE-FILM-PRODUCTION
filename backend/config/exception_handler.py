import traceback
from django.http import JsonResponse
from django.views.debug import ExceptionReporter

def custom_exception_handler(request, exception):
    """Custom exception handler to avoid the 'accepts' bug"""
    
    # Get the error details
    error_message = str(exception)
    error_traceback = traceback.format_exc()
    
    # Log the error
    print(f"ERROR: {error_message}")
    print(error_traceback)
    
    # Return a JSON response with error details
    return JsonResponse({
        "error": error_message,
        "traceback": error_traceback,
        "path": request.path,
        "method": request.method
    }, status=500)