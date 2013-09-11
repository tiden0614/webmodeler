
public interface UserDAO {
	public User findByUsername(String username);
	public void save(User user);
}
