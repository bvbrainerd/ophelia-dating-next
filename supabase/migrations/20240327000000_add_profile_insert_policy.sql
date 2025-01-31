-- Create policy to allow users to create their own profile
create policy "Users can create their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Create policy to allow users to insert their profile during signup
create policy "Users can insert their profile during signup"
  on public.profiles for insert
  with check (true); 