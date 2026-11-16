(*---
description: Evaluates a random bool expression, seed 262, number 4983.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04983 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<(IF FALSE THEN -1 ELSE 3 + LET b7756 == 0 IN SUBSET {1}), ((0 * -1) - (0 % -1))>> \/ (((1..3 \ {}) \cap UNION {{}, {x \in 1..3 : x > 1}}) \subseteq UNION {{b7757 : b7757 \in {}}, SelectSeq(<<>>, LAMBDA e : e > 0)})))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 81 to line 14, col 81 of module random_04983 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 79.
    | Expression starting at line 14, column 79.
    | ExtendableExpr starting at line 14, column 78.
    | Expression starting at line 14, column 78.
    | ExtendableExpr starting at line 14, column 77.
    | Fatal errors while parsing TLA+ spec in file random_04983
    | In module random_04983
    | Could not parse module random_04983 from file random_04983.tla
    | *** Errors: 1
    | In module random_04983
    | Could not parse module random_04983 from file random_04983.tla
    3002:1 Parsing or semantic analysis failed.
---*)
