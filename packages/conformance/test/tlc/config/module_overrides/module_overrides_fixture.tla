---- MODULE module_overrides_fixture ----
A == 1
B == 2
K == 1
Get == K
P(a) == a
UseP == P(1)
Sum == <<A, B>>
CONSTANT N
UseN == N
====
