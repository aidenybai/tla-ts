----------------------------- MODULE Arithmetic -----------------------------
EXTENDS Naturals

CONSTANT Offset

Double(n) == sum :: n + n + Offset

Ranges(n) == {k \in 0..n : even(k) :: k % 2 = 0}
=============================================================================
