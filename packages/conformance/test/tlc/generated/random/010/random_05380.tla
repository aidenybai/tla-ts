(*---
description: Evaluates a random bool expression, seed 262, number 5380.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05380 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> CASE (\E b8317 \in SUBSET {1} : FALSE) -> (<<5, 6>>)[1] [] OTHER -> (-0), b |-> (~(FALSE /\ 1..3))] = [a |-> ((1 - -1) + CASE <<5, 6>> -> 2147483647 [] OTHER -> 7), b |-> (Head(<<1>>) < (7 \div -1))]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 213 to line 14, col 216 of module random_05380 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 211.
    | Expression starting at line 14, column 211.
    | ExtendableExpr starting at line 14, column 210.
    | ExtendableExpr starting at line 14, column 196.
    | Expression starting at line 14, column 196.
    | Fatal errors while parsing TLA+ spec in file random_05380
    | In module random_05380
    | Could not parse module random_05380 from file random_05380.tla
    | *** Errors: 1
    | In module random_05380
    | Could not parse module random_05380 from file random_05380.tla
    3002:1 Parsing or semantic analysis failed.
---*)
