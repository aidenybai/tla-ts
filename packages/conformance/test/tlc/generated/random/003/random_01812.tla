(*---
description: Evaluates a random set expression, seed 262, number 1812.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01812 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b2866 \in (((0 .. 1..3) \ ({1} \cup {1})) \ {b2867 \in DOMAIN [x \in Nat |-> x + 1] : (1 \in {1})}) : ((IF FALSE THEN 2 ELSE 0 + LET b2868 == b2866 IN 1) < (CHOOSE b2869 \in {b2870 \in {} : TRUE} : SortSeq(<<1>>, LAMBDA p, q : p < q)))})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops .. in block line 14, col 32 to line 14, col 33 of module random_01812 and ...
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 35.
    | ExtendableExpr starting at line 14, column 30.
    | Expression starting at line 14, column 30.
    | ExtendableExpr starting at line 14, column 29.
    | Expression starting at line 14, column 29.
    | Fatal errors while parsing TLA+ spec in file random_01812
    | In module random_01812
    | Could not parse module random_01812 from file random_01812.tla
    | *** Errors: 1
    | In module random_01812
    | Could not parse module random_01812 from file random_01812.tla
    3002:1 Parsing or semantic analysis failed.
---*)
