(*---
description: Evaluates a random bool expression, seed 262, number 5065.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05065 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({b7881 \in {1, 2} : FALSE} \cup (2 .. 1)) \ {(b7882 * -1) : b7882 \in {2, 1}}) \subseteq UNION {({7 : b7883 \in {1}} \ (3 .. 7)), ({2, 3} \ (3 .. 7))}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 71 to line 14, col 71 of module random_05065 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 65.
    | Expression starting at line 14, column 65.
    | ExtendableExpr starting at line 14, column 64.
    | Expression starting at line 14, column 64.
    | Some { } form starting at line 14, column 63.
    | Fatal errors while parsing TLA+ spec in file random_05065
    | In module random_05065
    | Could not parse module random_05065 from file random_05065.tla
    | *** Errors: 1
    | In module random_05065
    | Could not parse module random_05065 from file random_05065.tla
    3002:1 Parsing or semantic analysis failed.
---*)
