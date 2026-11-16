---- MODULE BoundPrint ----
EXTENDS TLC
VARIABLE s
Test == Print("x", TRUE)
Init == s = TRUE
Next == s' = Test
====
