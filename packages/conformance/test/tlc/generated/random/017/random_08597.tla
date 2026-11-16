(*---
description: Evaluates a random set expression, seed 262, number 8597.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08597 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {({b13319 \in ({2, 1, 3} \cap {x \in 1..3 : x > 1}) : (FALSE => FALSE)} = {(0 * -1), (7 - 3)}), <<IF (TRUE <=> TRUE) THEN Len(<<>>) ELSE CASE TRUE -> 7 [] OTHER -> 0, (CHOOSE b13320 \in (3 .. 3) : (SUBSET {1} = [a |-> 1, b |-> TRUE]))>>})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 100 to line 14, col 100 of module random_08597 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 98.
    | Expression starting at line 14, column 98.
    | ExtendableExpr starting at line 14, column 97.
    | Expression starting at line 14, column 97.
    | Some { } form starting at line 14, column 96.
    | Fatal errors while parsing TLA+ spec in file random_08597
    | In module random_08597
    | Could not parse module random_08597 from file random_08597.tla
    | *** Errors: 1
    | In module random_08597
    | Could not parse module random_08597 from file random_08597.tla
    3002:1 Parsing or semantic analysis failed.
---*)
