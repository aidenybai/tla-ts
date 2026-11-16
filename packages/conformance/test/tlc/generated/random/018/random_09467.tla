(*---
description: Evaluates a random set expression, seed 262, number 9467.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09467 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b14713 \in {LET b14715 == -1 IN b14714 : b14714 \in (0 .. 3)} : (~(<<1, 2>> = (1 :> 2)))) .. CASE (~[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7]) -> ((1 * -1) % IF TRUE THEN 2 ELSE 3) [] OTHER -> ([<<5, 6>> EXCEPT ![[a |-> 1, b |-> TRUE]] = 3])[(0 % 0)]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 176 to line 14, col 176 of module random_09467 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 174.
    | Expression starting at line 14, column 174.
    | ExtendableExpr starting at line 14, column 173.
    | Expression starting at line 14, column 173.
    | ExtendableExpr starting at line 14, column 172.
    | Fatal errors while parsing TLA+ spec in file random_09467
    | In module random_09467
    | Could not parse module random_09467 from file random_09467.tla
    | *** Errors: 1
    | In module random_09467
    | Could not parse module random_09467 from file random_09467.tla
    3002:1 Parsing or semantic analysis failed.
---*)
