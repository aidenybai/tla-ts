--------------------------- MODULE SelectionInner ---------------------------
EXTENDS Naturals

VARIABLE x

Foo == LET y == 10 IN x + y

Bar(a) == LET y(b) == a * b IN x + y(2)
=============================================================================
