-- Trigger: auto-cria profile em public.profiles quando novo usuário é criado no auth.users
-- O role e name vêm de raw_user_meta_data passado no signup (app_metadata não é editável pelo cliente)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'PATIENT'::user_role
    )
  );
  RETURN NEW;
END;
$$;

-- Trigger dispara após INSERT em auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Permissão para INSERT em profiles via trigger (service_role já tem acesso, mas garantimos authenticated também)
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);;
