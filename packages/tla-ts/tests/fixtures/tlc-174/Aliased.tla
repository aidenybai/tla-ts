---- MODULE Aliased ----
VARIABLE x
Init == x = 0
Next == x' = x
Alias == [y |-> x]
====
