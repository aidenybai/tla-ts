---- MODULE Omit ----
EXTENDS Naturals
THEOREM A == 1 + 1 = 2
  OMITTED
THEOREM B == 2 + 2 = 4
<1>1. 2 = 2
  OBVIOUS
<1>2. QED
  BY <1>1
THEOREM C == 3 = 3
====
