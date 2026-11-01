---- MODULE Undefined ----
VARIABLE x
Init == x = 0
Next == UNCHANGED x
RECURSIVE F(_), F(_)
====
