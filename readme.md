# autoproxy-trans-service

translating autoproxy list file to pac

## USAGE

### starting up

	node build/app.js

### generating pac

	# generating fast mode
	http://localhost:11082/proxy.pac?proxy=SOCKS%20127.0.0.1%3A8080&precise=false
	# generating precise mode
	http://localhost:11082/proxy.pac?proxy=SOCKS%20127.0.0.1%3A8080&precise=true

### generating apnp mobileconfig

	http://localhost:11082/apnp.mobileconfig?server=127.0.0.1&port=8080