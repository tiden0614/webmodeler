import java.io.InputStream;


public abstract class UserService {
	public static String LOGIN_SUCCESS = "01";
	public static String LOGIN_INVALID_USERNAME = "02";
	public static String LOGIN_INVALID_PASSWORD = "03";
	public static String _basePath;
	
	public abstract String authenticate(String username, String password);
	public abstract String saveUserData(String username, InputStream in) throws Exception;
	public abstract String loadUserData(String username) throws Exception;
	
	public static void setBasePath(String basePath){
		_basePath = basePath;
	}
}
