(*---
description: Evaluates a random bool expression, seed 262, number 4897.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04897 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({CASE TRUE -> 2 [] OTHER -> 0, (-2)} \cup ({b7625 : b7625 \in {1, 2}} \ ({} \ {}))) \subseteq {((CHOOSE f \in [{2, 1, 3} -> {2, 1, 3}] : TRUE))[(b7626 * -1)] : b7626 \in {b7627 \in {b7628 \in {x \in 1..3 : x > 1} : FALSE} : (TRUE => FALSE)}}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 169 to line 14, col 169 of module random_04897 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 163.
    | Expression starting at line 14, column 163.
    | ExtendableExpr starting at line 14, column 162.
    | Expression starting at line 14, column 162.
    | Some [] Form starting at line 14, column 161.
    | Fatal errors while parsing TLA+ spec in file random_04897
    | In module random_04897
    | Could not parse module random_04897 from file random_04897.tla
    | *** Errors: 1
    | In module random_04897
    | Could not parse module random_04897 from file random_04897.tla
    3002:1 Parsing or semantic analysis failed.
---*)
