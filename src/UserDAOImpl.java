import java.sql.ResultSet;
import java.util.Date;


public class UserDAOImpl implements UserDAO{
	
	public User findByUsername(String username){
		if(username == null || username.equals("")) return null;
		ResultSet rs = SQLUtil.query("Select * from user where username='" + username + "'");
		String _usrn 		  ;
		String _psw 		  ;
		String _path 		  ;
		String _registerTime  ;
		String _lastLogin 	  ;
		try{
			if(!rs.next()) return null;
			_usrn 			= rs.getString("username");
			_psw 			= rs.getString("password");
			_path 			= rs.getString("path");
			_registerTime 	= rs.getString("registerTime");
			_lastLogin 		= rs.getString("lastLogin");
		} catch (Exception e){
			e.printStackTrace();
			return null;
		}
		User _u = new User(_usrn, _psw);
		_u.setPath(_path);
		_u.setCreateTime(_registerTime);
		_u.setLastLogin(_lastLogin);
		return _u;
	}
	
	public void save(User user){
		User _u = findByUsername(user.getUsername());
		if(_u == null){
			SQLUtil.update("Insert into user values('" + user.getUsername() + "',"
							+ "'" + user.getPassword() + "',"
							+ "'" + user.getPath() + "',"
							+ "'" + user.getCreateTime() + "',"
							+ "'" + user.getLastLogin() + "',"
							+ ")"
					);
		} else {
			_u.copy(user);
			SQLUtil.update("Update user set "
					+ "password='" + _u.getPassword() + "', "
					+ "path='" + _u.getPath() + "', "
					+ "registerTime='" + _u.getCreateTime() + "', "
					+ "lastLogin='" + _u.getLastLogin() + "' "
					+ "Where username='" + _u.getUsername() + "'"
					);
		}
	}

}
