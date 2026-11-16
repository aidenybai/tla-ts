(*---
description: Evaluates a random set expression, seed 262, number 3554.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03554 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Len(Tail(<<1>>)) : b5621 \in {(-1 \div -1), (<<>> \o <<1>>)}} \cup DOMAIN (([a |-> 1]).a :> (1 * 2))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 52 to line 14, col 55 of module random_03554 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 50.
    | Expression starting at line 14, column 49.
    | ExtendableExpr starting at line 14, column 48.
    | Expression starting at line 14, column 48.
    | Some { } form starting at line 14, column 47.
    | Fatal errors while parsing TLA+ spec in file random_03554
    | In module random_03554
    | Could not parse module random_03554 from file random_03554.tla
    | *** Errors: 1
    | In module random_03554
    | Could not parse module random_03554 from file random_03554.tla
    3002:1 Parsing or semantic analysis failed.
---*)
