import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Date;


public class UserServiceImpl extends UserService{
	public UserDAO userDAO = new UserDAOImpl();
	
	public String authenticate(String username, String password){
		User _u = userDAO.findByUsername(username);
		if(_u == null) return LOGIN_INVALID_USERNAME;
		
		if(_u.getPassword().equals(password)) {
			_u.setLastLogin((new Date()).toString());
			userDAO.save(_u);
			return LOGIN_SUCCESS;
		}
		else return LOGIN_INVALID_PASSWORD;
	}
	
	public String saveUserData(String username, InputStream in) throws Exception{
		User _u = userDAO.findByUsername(username);
		if(_u == null) throw new Exception("Invalid user");
		String path = _u.getPath();
		File f = new File(_basePath + "storageXMLs/" + path + "/entities.xml");
		byte[] xmlDataByte = getContent(in);

		// Output to XML file
		FileOutputStream outputxml = new FileOutputStream(f, false);
		outputxml.write(xmlDataByte);
		outputxml.close();
		
		return new String(xmlDataByte, "UTF-8");
	}
	
	public String loadUserData(String username) throws Exception{
		User _u = userDAO.findByUsername(username);
		if(_u == null) throw new Exception("Invalid user");
		String path = _u.getPath();
		File f = new File(_basePath + "storageXMLs/" + path + "/entities.xml");
		FileInputStream in = new FileInputStream(f);
		byte[] xmlDataByte = getContent(in);
		
		return new String(xmlDataByte, "UTF-8");
	}
	
	private byte[] getContent(InputStream in) throws IOException {
		int size = in.available();
		
		// get bytes from input stream
		byte[] buffer = new byte[size];
		byte[] data = new byte[size];

		int count = 0;
		int rbyte = 0;

		while (count < size) {
			rbyte = in.read(buffer);
			for (int i = 0; i < rbyte; i++) {
				data[count + i] = buffer[i];
			}
			count += rbyte;
		}

		return data;
	}
}
