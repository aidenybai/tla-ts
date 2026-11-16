(*---
description: Evaluates a random seq expression, seed 262, number 8153.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08153 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq([SubSeq(SubSeq(<<3, 1, 2>>, SUBSET {1}, 2147483647), (SUBSET {1} - 1), Head(<<>>)) EXCEPT ![1] = ((TRUE + 2147483647) + Cardinality({}))], Cardinality(UNION {(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE), (2147483647 .. 2)}), CASE (\E b12609 \in {-1 : b12610 \in {}} : ([a |-> 1] /\ FALSE)) -> (IF TRUE THEN 2 ELSE 2 \div Len(<<3, 1, 2>>)) [] OTHER -> LET b12611 == Len(<<1>>) IN Head(<<>>)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops SUBSET in block line 14, col 77 to line 14, col 82 of module random_08153 and -.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 84.
    | Expression starting at line 14, column 77.
    | ExtendableExpr starting at line 14, column 76.
    | Expression starting at line 14, column 76.
    | Optional Arguments starting at line 14, column 30.
    | Fatal errors while parsing TLA+ spec in file random_08153
    | In module random_08153
    | Could not parse module random_08153 from file random_08153.tla
    | *** Errors: 1
    | In module random_08153
    | Could not parse module random_08153 from file random_08153.tla
    3002:1 Parsing or semantic analysis failed.
---*)
