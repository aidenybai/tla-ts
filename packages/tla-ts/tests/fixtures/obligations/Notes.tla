---- MODULE Notes ----
VARIABLE x
---- MODULE Inner ----
CONSTANT c
VARIABLE y
Next == y' = y
Live == ENABLED Next
THEOREM c = c
====
I(c) == INSTANCE Inner WITH y <- x
====
