(*---
description: Evaluates a random int expression, seed 262, number 6061.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06061 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (~([[a |-> 1] EXCEPT !.a = 1] = SubSeq(<<1>>, 1, 7))) THEN SubSeq(Tail(<<0, 7>>), CASE (TRUE \/ TRUE) -> (0 \div -1) [] OTHER -> (<<5, 6>>)[3], IF (FALSE <=> [x \in Nat |-> x + 1]) THEN LET b9340 == 0 IN 3 ELSE Cardinality({2, 1, 3})) ELSE ((CASE FALSE -> 2147483647 [] OTHER -> 3 - ([x \in Nat |-> x + 1])[2]) + Len(SubSeq(<<>>, 2147483647, 1))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 127 to line 14, col 130 of module random_06061 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 125.
    | Expression starting at line 14, column 125.
    | ExtendableExpr starting at line 14, column 124.
    | Expression starting at line 14, column 124.
    | Case Arm starting at line 14, column 106.
    | Fatal errors while parsing TLA+ spec in file random_06061
    | In module random_06061
    | Could not parse module random_06061 from file random_06061.tla
    | *** Errors: 1
    | In module random_06061
    | Could not parse module random_06061 from file random_06061.tla
    3002:1 Parsing or semantic analysis failed.
---*)
