(*---
description: Evaluates a random bool expression, seed 262, number 1597.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01597 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([<<5, 6>> EXCEPT ![0] = 1] = (SUBSET {1} \cap {})) /\ ({2 : b2553 \in 1..3} \subseteq (SUBSET {1} \cup SUBSET {1}))) /\ (((3 + 7) % (2 \div -1)) \in {Len(<<1, 2>>) : b2554 \in UNION {{1, 2}, 1..3}})))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 154 to line 14, col 157 of module random_01597 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 152.
    | Expression starting at line 14, column 152.
    | ExtendableExpr starting at line 14, column 151.
    | ExtendableExpr starting at line 14, column 141.
    | Expression starting at line 14, column 141.
    | Fatal errors while parsing TLA+ spec in file random_01597
    | In module random_01597
    | Could not parse module random_01597 from file random_01597.tla
    | *** Errors: 1
    | In module random_01597
    | Could not parse module random_01597 from file random_01597.tla
    3002:1 Parsing or semantic analysis failed.
---*)
