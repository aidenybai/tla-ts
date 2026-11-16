(*---
description: Evaluates a random seq expression, seed 262, number 6110.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06110 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([Append(<<>>, -1) EXCEPT ![1] = (0 * -1)] \o <<CASE FALSE -> 0 [] OTHER -> 2, (CHOOSE b9403 \in {x \in 1..3 : x > 1} : TRUE)>>) EXCEPT ![1] = ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 53 to line 14, col 53 of module random_06110 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 51.
    | Expression starting at line 14, column 51.
    | ExtendableExpr starting at line 14, column 50.
    | Expression starting at line 14, column 50.
    | Except Spec starting at line 14, column 43.
    | Fatal errors while parsing TLA+ spec in file random_06110
    | In module random_06110
    | Could not parse module random_06110 from file random_06110.tla
    | *** Errors: 1
    | In module random_06110
    | Could not parse module random_06110 from file random_06110.tla
    3002:1 Parsing or semantic analysis failed.
---*)
