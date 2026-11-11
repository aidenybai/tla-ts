(*---
description: Evaluates a random record expression, seed 262, number 5747.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05747 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE f \in [{1, 2} -> {1, 2} \cap {2}] : TRUE) EXCEPT ![IF (\A b8847 \in {1, 2} : FALSE) THEN (2147483647 + 2147483647) ELSE Len(<<1, 2>>)] = ((3 % 0) - (-1 * -1))])[((Tail(<<3, 1, 2>>) = (CHOOSE f \in [{2, 1, 3} -> {1, 2} \ {1}] : TRUE)) \/ ({0, 3} \subseteq {b8848 \in SUBSET {1} : TRUE}))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 178 to line 14, col 178 of module random_05747 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 176.
    | Expression starting at line 14, column 175.
    | ExtendableExpr starting at line 14, column 174.
    | ExtendableExpr starting at line 14, column 164.
    | Expression starting at line 14, column 164.
    | Fatal errors while parsing TLA+ spec in file random_05747
    | In module random_05747
    | Could not parse module random_05747 from file random_05747.tla
    | *** Errors: 1
    | In module random_05747
    | Could not parse module random_05747 from file random_05747.tla
    3002:1 Parsing or semantic analysis failed.
---*)
