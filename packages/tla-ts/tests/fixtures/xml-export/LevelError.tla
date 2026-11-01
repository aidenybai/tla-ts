---- MODULE LevelError ----
VARIABLE x
---- MODULE Inner ----
VARIABLE y
Foo == y' = 0
====
I(z) == INSTANCE Inner WITH y <- z
Bar == I(x')!Foo
====
