---- MODULE Incomplete ----
EXTENDS Naturals
THEOREM A == 1 + 1 = 2
<1>1. 1 = 1
<1>2. 2 = 2
  OMITTED
<1>3. QED
  BY <1>1, <1>2
---- MODULE Inner ----
THEOREM B == TRUE
====
THEOREM C == 2 + 2 = 4
  OMITTED
====
