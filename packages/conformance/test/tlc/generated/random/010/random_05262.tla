(*---
description: Evaluates a random bool expression, seed 262, number 5262.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05262 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Head(<<1>>) * Cardinality({1, 2})) :> IF (TRUE \/ TRUE) THEN (0 + -1) ELSE ([a |-> 1, b |-> TRUE]).a) => (((0 * -1) \in (1..3 \cap 2..1)) => (({1} \subseteq 1..3) => ({} \subseteq {1})))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 129 to line 14, col 129 of module random_05262 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 127.
    | Expression starting at line 14, column 127.
    | ExtendableExpr starting at line 14, column 126.
    | Expression starting at line 14, column 126.
    | ExtendableExpr starting at line 14, column 125.
    | Fatal errors while parsing TLA+ spec in file random_05262
    | In module random_05262
    | Could not parse module random_05262 from file random_05262.tla
    | *** Errors: 1
    | In module random_05262
    | Could not parse module random_05262 from file random_05262.tla
    3002:1 Parsing or semantic analysis failed.
---*)
