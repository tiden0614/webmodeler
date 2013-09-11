import java.sql.DriverManager;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;


public class SQLUtil {
	private static Connection[]	pool;
	private static int[] poolState;
	private static int poolSize = 1;
	private static String host = "localhost:3306/webmodeler";
	private static String usr = "tiden";
	private static String psw = "000000";
	static {
		try {
			Class.forName("com.mysql.jdbc.Driver");
			pool = new Connection[poolSize];
			poolState = new int[poolSize];
			for(int i = 0; i<poolSize;i++){
				pool[i] = DriverManager.getConnection("jdbc:mysql://" + host,usr,psw);
				poolState[i] = 0;
			}
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	public synchronized static Connection getConnection() throws Exception{
		
		for(int i = 0; i < poolSize; i++){
			if(poolState[i] == 0){
				poolState[i] = 1;
				return pool[i];
			}
		}
		
		throw new Exception("No idle connection in the pool");
	}
	
	public synchronized static void returnConnection(Connection connection){
		for(int i = 0; i < poolSize; i++){
			if(connection.equals(pool[i]))
				poolState[i] = 0;
		}
	}
	
	public static ResultSet query(String sql){
		try {
			Connection conn = getConnection();
			Statement sta = conn.createStatement();
			ResultSet rs = sta.executeQuery(sql);
			returnConnection(conn);
			return rs;
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return null;
		}
	}
	
	public static void update(String sql){
		try {
			Connection conn = getConnection();
			Statement sta = conn.createStatement();
			sta.executeUpdate(sql);
			returnConnection(conn);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
}
