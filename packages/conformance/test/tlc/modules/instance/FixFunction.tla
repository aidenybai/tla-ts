---- MODULE FixFunction ----
EXTENDS Naturals
CONSTANT c
h[z \in {1, 2}] == z + c
H == h[1] + 1
k[z \in {1, c + 1}] == z
====
