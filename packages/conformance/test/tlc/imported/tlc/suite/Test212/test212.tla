(*---
description: Ported from TLC's Test212.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/Test212.java
features:
  - tlc-suite
outcome: parse-error
config: ""
includes:
  - test212b.tla
  - test212a.tla
---*)
--------------------------- MODULE test212 --------------------------
\* Test of Leibniz checking
\*   Uses the fact that you can't substitute a non-Leibniz operator
\*   for a constant operator.
VARIABLE x

Leibniz(a2) == {a2 , x'}
NonLeibniz2(a, b) == <<a, b'>>
L ==  INSTANCE test212b WITH y <- x

NonLeibniz(a1) == a1'
Leibniz2(a, b) == <<a, b, x'>>

I(a) == INSTANCE test212b WITH y <- a
LL == INSTANCE test212b WITH y <- ENABLED (x'=x)
NonL(a) ==INSTANCE test212b WITH y <- ENABLED a

\* Legal
L1 == INSTANCE test212a WITH Op <- Leibniz, Op2 <- Leibniz2
L2 == INSTANCE test212a WITH Op <- LAMBDA a : I(a)!Leibniz(1), 
                             Op2 <- Leibniz2
L3 == INSTANCE test212a WITH Op <- Leibniz, Op2 <- I!Leibniz
L4 == INSTANCE test212a WITH Op <- Leibniz, Op2 <- LL!Leibniz2
L5 == INSTANCE test212a WITH Op <- LL!Leibniz, Op2 <- Leibniz2

\* Illegal
I1 == INSTANCE test212a WITH Op <- Leibniz, Op2 <- NonLeibniz2
I2 == INSTANCE test212a WITH Op <- NonLeibniz, Op2 <- Leibniz2
I3 == INSTANCE test212a WITH Op <- NonL!NoArg, Op2 <- Leibniz2
I4 == INSTANCE test212a WITH Op <- Leibniz, Op2 <- L!NonLeibniz2
I5 == INSTANCE test212a WITH Op <- Leibniz, Op2 <- NonL!Leibniz
I6 == INSTANCE test212a WITH Op <- Leibniz, Op2 <- I!NonLeibniz
==================================================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 6
    | line 38, col 1 to line 38, col 62 of module test212
    | Error in instantiating module 'test212a':
    |  A non-Leibniz operator substituted for 'Op2'.
    | line 39, col 1 to line 39, col 62 of module test212
    | Error in instantiating module 'test212a':
    |  A non-Leibniz operator substituted for 'Op'.
    | line 40, col 1 to line 40, col 62 of module test212
    | Error in instantiating module 'test212a':
    |  A non-Leibniz operator substituted for 'Op'.
    | line 41, col 1 to line 41, col 64 of module test212
    | Error in instantiating module 'test212a':
    |  A non-Leibniz operator substituted for 'Op2'.
    | line 42, col 1 to line 42, col 63 of module test212
    | Error in instantiating module 'test212a':
    |  A non-Leibniz operator substituted for 'Op2'.
    | line 43, col 1 to line 43, col 63 of module test212
    | Error in instantiating module 'test212a':
    |  A non-Leibniz operator substituted for 'Op2'.
    3002:1 Parsing or semantic analysis failed.
---*)
