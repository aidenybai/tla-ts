---- MODULE ViewLasso ----
EXTENDS Naturals
VARIABLES s, y
Init == s = 0 /\ y = 0
Next == y' = 1 - y /\ UNCHANGED s
Spec == Init /\ [][Next]_<<s, y>>
Prop == [](y = 1 => <>(y = 0))
View == s
====
