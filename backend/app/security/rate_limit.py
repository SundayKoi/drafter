from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# Applied as decorators on route handlers:
# POST /series/new       -> @limiter.limit("20/hour")
# GET  /champions        -> @limiter.limit("60/minute")
# GET  /series/{id}      -> @limiter.limit("120/minute")
