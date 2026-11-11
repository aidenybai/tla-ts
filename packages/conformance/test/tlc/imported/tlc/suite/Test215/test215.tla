(*---
description: Ported from TLC's Test215.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/Test215.java
features:
  - tlc-suite
outcome: parse-error
config: ""
---*)
------------------------- MODULE test215 ------------------------- 
\* Test of constraints on levels of temporal operators that
\* outlaw any form of raw TLA.

VARIABLE x

a == x ~> []x
b == x' ~> []x    \* ERROR
c == []x ~> x'    \* ERROR

d == x -+-> []x
e == x' -+-> []x  \* ERROR
f == []x -+-> x'  \* ERROR

g == <><<x'>>_x
h == <>(x')       \* ERROR

foo == [][x']_x

bar == [](x')    \* ERROR

m == \A i \in {}, j \in x : []x
n == \A i \in {}, j \in x' : []x   \* ERROR

mm == \E i \in {}, j \in x : []x
nn == \E i \in {}, j \in x' : []x   \* ERROR

m2 == \A i \in x' : x'
=======================================================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 8
    | line 16, col 6 to line 16, col 14 of module test215
    | Action used where only temporal formula or state predicate allowed.
    | line 17, col 6 to line 17, col 14 of module test215
    | Action used where only temporal formula or state predicate allowed.
    | line 20, col 6 to line 20, col 16 of module test215
    | Action used where only temporal formula or state predicate allowed.
    | line 21, col 6 to line 21, col 16 of module test215
    | Action used where only temporal formula or state predicate allowed.
    | line 24, col 6 to line 24, col 11 of module test215
    | <> followed by action not of form <<A>>_v.
    | line 28, col 8 to line 28, col 13 of module test215
    | [] followed by action not of form [A]_v.
    | line 31, col 25 to line 31, col 26 of module test215
    | Action-level bound of quantified temporal formula.
    | line 34, col 26 to line 34, col 27 of module test215
    | Action-level bound of quantified temporal formula.
    3002:1 Parsing or semantic analysis failed.
---*)
