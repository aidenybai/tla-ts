(*---
description: Evaluates a random seq expression, seed 262, number 1077.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01077 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Cardinality(DOMAIN ([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x])), ((UNION {{x \in 1..3 : x > 1}, 1..3} % Cardinality(Nat)) * (([x \in Nat |-> x + 1])[3] * (2147483647 + 3))), IF ({b1717 : b1717 \in {}} = ({} \ {1})) THEN ((2147483647 % 2) % Len(<<1, 2>>)) ELSE Len(Append(<<>>, -1))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops UNION in block line 14, col 89 to line 14, col 93 of module random_01077 and %.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 95.
    | Expression starting at line 14, column 89.
    | ExtendableExpr starting at line 14, column 88.
    | Expression starting at line 14, column 88.
    | ExtendableExpr starting at line 14, column 87.
    | Fatal errors while parsing TLA+ spec in file random_01077
    | In module random_01077
    | Could not parse module random_01077 from file random_01077.tla
    | *** Errors: 1
    | In module random_01077
    | Could not parse module random_01077 from file random_01077.tla
    3002:1 Parsing or semantic analysis failed.
---*)
