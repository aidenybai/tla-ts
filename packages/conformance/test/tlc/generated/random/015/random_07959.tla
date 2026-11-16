(*---
description: Evaluates a random function expression, seed 262, number 7959.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07959 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (0 \div 1), b |-> (TRUE /\ TRUE)] EXCEPT ![([[a |-> 1] EXCEPT !.a = 7]).a] = (([a |-> 1]).a - (3 + 7))] EXCEPT ![([[[x \in 1..2 |-> x] EXCEPT ![3] = 7] EXCEPT ![Head(<<1, 2>>)] = Cardinality({})] - (CASE TRUE -> -1 [] OTHER -> SUBSET {1} + ([a |-> 1]).a))] = ([b12285 \in (3 .. 1) |-> (0 - -1)])[Cardinality((2..1 \ {1}))]])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops SUBSET in block line 14, col 252 to line 14, col 257 of module random_07959 and +.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 259.
    | Expression starting at line 14, column 252.
    | Case Other Arm starting at line 14, column 243.
    | CASE Expression starting at line 14, column 224.
    | Expression starting at line 14, column 224.
    | Fatal errors while parsing TLA+ spec in file random_07959
    | In module random_07959
    | Could not parse module random_07959 from file random_07959.tla
    | *** Errors: 1
    | In module random_07959
    | Could not parse module random_07959 from file random_07959.tla
    3002:1 Parsing or semantic analysis failed.
---*)
