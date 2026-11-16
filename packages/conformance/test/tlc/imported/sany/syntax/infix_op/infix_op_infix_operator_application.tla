(*---
description: Infix Operator Application. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/infix_op.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE infix_op_infix_operator_application ----

op == {
  x & y,
  x && y,
  x \approx y,
  x := y,
  x \asymp y,
  x \bigcirc y,
  x ::= y,
  x \bullet y,
  x \intersect y,
  x \cap y,
  x \cdot y,
  x \o y,
  x \circ y,
  x @@ y,
  x \cong y,
  x \union y,
  x \cup y,
  x \div y,
  x $ y,
  x $$ y,
  x \doteq y,
  x .. y,
  x ... y,
  x = y,
  x \equiv y,
  x !! y,
  x >= y,
  x \geq y,
  x \gg y,
  x > y,
  x ## y,
  x <=> y,
  x => y,
  x \in y,
  x /\ y,
  x \land y,
  x =| y,
  x ~> y,
  x <= y,
  x =< y,
  x \leq y,
  x \ll y,
  x \/ y,
  x \lor y,
  x -| y,
  x < y,
  x <: y,
  x :> y,
  x - y,
  x -- y,
  x % y,
  x %% y,
  x * y,
  x ** y,
  x /= y,
  x # y,
  x \notin y,
  x (.) y,
  x \odot y,
  x (-) y,
  x \ominus y,
  x (+) y,
  x \oplus y,
  x (/) y,
  x \oslash y,
  x (\X) y,
  x \otimes y,
  x + y,
  x -+-> y,
  x ++ y,
  x ^ y,
  x ^^ y,
  x \prec y,
  x \preceq y,
  x \propto y,
  x ?? y,
  x |= y,
  x |- y,
  x \ y,
  x \sim y,
  x \simeq y,
  x / y,
  x // y,
  x \sqcap y,
  x \sqcup y,
  x \sqsubset y,
  x \sqsubseteq y,
  x \sqsupset y,
  x \sqsupseteq y,
  x \star y,
  x \subset y,
  x \subseteq y,
  x \succ y,
  x \succeq y,
  x \supset y,
  x \supseteq y,
  x \X y,
  x \times y,
  x \uplus y,
  x | y,
  x || y,
  x \wr y
}

====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 204
    | line 11, col 5 to line 11, col 5 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '&'.
    | line 11, col 3 to line 11, col 7 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `&'.
    | line 12, col 5 to line 12, col 6 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '&&'.
    | line 12, col 3 to line 12, col 8 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `&&'.
    | line 13, col 5 to line 13, col 11 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\approx'.
    | line 13, col 3 to line 13, col 13 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\approx'.
    | line 14, col 5 to line 14, col 6 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol ':='.
    | line 14, col 3 to line 14, col 8 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `:='.
    | line 15, col 5 to line 15, col 10 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\asymp'.
    | line 15, col 3 to line 15, col 12 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\asymp'.
    | line 16, col 5 to line 16, col 12 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\bigcirc'.
    | line 16, col 3 to line 16, col 14 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\bigcirc'.
    | line 17, col 5 to line 17, col 7 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '::='.
    | line 17, col 3 to line 17, col 9 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `::='.
    | line 18, col 5 to line 18, col 11 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\bullet'.
    | line 18, col 3 to line 18, col 13 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\bullet'.
    | line 19, col 3 to line 19, col 3 of module infix_op_infix_operator_application
    | Unknown operator: `x'.
    | line 19, col 16 to line 19, col 16 of module infix_op_infix_operator_application
    | Unknown operator: `y'.
    | line 20, col 3 to line 20, col 3 of module infix_op_infix_operator_application
    | Unknown operator: `x'.
    | line 20, col 10 to line 20, col 10 of module infix_op_infix_operator_application
    | Unknown operator: `y'.
    | line 21, col 3 to line 21, col 3 of module infix_op_infix_operator_application
    | Unknown operator: `x'.
    | line 21, col 11 to line 21, col 11 of module infix_op_infix_operator_application
    | Unknown operator: `y'.
    | line 22, col 5 to line 22, col 6 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\o'.
    | line 22, col 3 to line 22, col 8 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\o'.
    | line 23, col 5 to line 23, col 9 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\circ'.
    | line 23, col 3 to line 23, col 11 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\circ'.
    | line 24, col 5 to line 24, col 6 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '@@'.
    | line 24, col 3 to line 24, col 8 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `@@'.
    | line 25, col 5 to line 25, col 9 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\cong'.
    | line 25, col 3 to line 25, col 11 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\cong'.
    | line 26, col 3 to line 26, col 3 of module infix_op_infix_operator_application
    | Unknown operator: `x'.
    | line 26, col 12 to line 26, col 12 of module infix_op_infix_operator_application
    | Unknown operator: `y'.
    | line 27, col 3 to line 27, col 3 of module infix_op_infix_operator_application
    | Unknown operator: `x'.
    | line 27, col 10 to line 27, col 10 of module infix_op_infix_operator_application
    | Unknown operator: `y'.
    | line 28, col 5 to line 28, col 8 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\div'.
    | line 28, col 3 to line 28, col 10 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\div'.
    | line 29, col 5 to line 29, col 5 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '$'.
    | line 29, col 3 to line 29, col 7 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `$'.
    | line 30, col 5 to line 30, col 6 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '$$'.
    | line 30, col 3 to line 30, col 8 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `$$'.
    | line 31, col 5 to line 31, col 10 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\doteq'.
    | line 31, col 3 to line 31, col 12 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\doteq'.
    | line 32, col 5 to line 32, col 6 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '..'.
    | line 32, col 3 to line 32, col 8 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `..'.
    | line 33, col 5 to line 33, col 7 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '...'.
    | line 33, col 3 to line 33, col 9 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `...'.
    | line 34, col 3 to line 34, col 3 of module infix_op_infix_operator_application
    | Unknown operator: `x'.
    | line 34, col 7 to line 34, col 7 of module infix_op_infix_operator_application
    | Unknown operator: `y'.
    | line 35, col 3 to line 35, col 3 of module infix_op_infix_operator_application
    | Unknown operator: `x'.
    | line 35, col 12 to line 35, col 12 of module infix_op_infix_operator_application
    | Unknown operator: `y'.
    | line 36, col 5 to line 36, col 6 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '!!'.
    | line 36, col 3 to line 36, col 8 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `!!'.
    | line 37, col 5 to line 37, col 6 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '>='.
    | line 37, col 3 to line 37, col 8 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `>='.
    | line 38, col 5 to line 38, col 8 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\geq'.
    | line 38, col 3 to line 38, col 10 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\geq'.
    | line 39, col 5 to line 39, col 7 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\gg'.
    | line 39, col 3 to line 39, col 9 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\gg'.
    | line 40, col 5 to line 40, col 5 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '>'.
    | line 40, col 3 to line 40, col 7 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `>'.
    | line 41, col 5 to line 41, col 6 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '##'.
    | line 41, col 3 to line 41, col 8 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `##'.
    | line 42, col 3 to line 42, col 3 of module infix_op_infix_operator_application
    | Unknown operator: `x'.
    | line 42, col 9 to line 42, col 9 of module infix_op_infix_operator_application
    | Unknown operator: `y'.
    | line 43, col 3 to line 43, col 3 of module infix_op_infix_operator_application
    | Unknown operator: `x'.
    | line 43, col 8 to line 43, col 8 of module infix_op_infix_operator_application
    | Unknown operator: `y'.
    | line 44, col 3 to line 44, col 3 of module infix_op_infix_operator_application
    | Unknown operator: `x'.
    | line 44, col 9 to line 44, col 9 of module infix_op_infix_operator_application
    | Unknown operator: `y'.
    | line 45, col 3 to line 45, col 3 of module infix_op_infix_operator_application
    | Unknown operator: `x'.
    | line 45, col 8 to line 45, col 8 of module infix_op_infix_operator_application
    | Unknown operator: `y'.
    | line 46, col 3 to line 46, col 3 of module infix_op_infix_operator_application
    | Unknown operator: `x'.
    | line 46, col 11 to line 46, col 11 of module infix_op_infix_operator_application
    | Unknown operator: `y'.
    | line 47, col 5 to line 47, col 6 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '=|'.
    | line 47, col 3 to line 47, col 8 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `=|'.
    | line 48, col 3 to line 48, col 3 of module infix_op_infix_operator_application
    | Unknown operator: `x'.
    | line 48, col 8 to line 48, col 8 of module infix_op_infix_operator_application
    | Unknown operator: `y'.
    | line 49, col 5 to line 49, col 6 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '<='.
    | line 49, col 3 to line 49, col 8 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `<='.
    | line 50, col 5 to line 50, col 6 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '=<'.
    | line 50, col 3 to line 50, col 8 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `=<'.
    | line 51, col 5 to line 51, col 8 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\leq'.
    | line 51, col 3 to line 51, col 10 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\leq'.
    | line 52, col 5 to line 52, col 7 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\ll'.
    | line 52, col 3 to line 52, col 9 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\ll'.
    | line 53, col 3 to line 53, col 3 of module infix_op_infix_operator_application
    | Unknown operator: `x'.
    | line 53, col 8 to line 53, col 8 of module infix_op_infix_operator_application
    | Unknown operator: `y'.
    | line 54, col 3 to line 54, col 3 of module infix_op_infix_operator_application
    | Unknown operator: `x'.
    | line 54, col 10 to line 54, col 10 of module infix_op_infix_operator_application
    | Unknown operator: `y'.
    | line 55, col 5 to line 55, col 6 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '-|'.
    | line 55, col 3 to line 55, col 8 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `-|'.
    | line 56, col 5 to line 56, col 5 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '<'.
    | line 56, col 3 to line 56, col 7 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `<'.
    | line 57, col 5 to line 57, col 6 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '<:'.
    | line 57, col 3 to line 57, col 8 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `<:'.
    | line 58, col 5 to line 58, col 6 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol ':>'.
    | line 58, col 3 to line 58, col 8 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `:>'.
    | line 59, col 5 to line 59, col 5 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '-'.
    | line 59, col 3 to line 59, col 7 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `-'.
    | line 60, col 5 to line 60, col 6 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '--'.
    | line 60, col 3 to line 60, col 8 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `--'.
    | line 61, col 5 to line 61, col 5 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '%'.
    | line 61, col 3 to line 61, col 7 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `%'.
    | line 62, col 5 to line 62, col 6 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '%%'.
    | line 62, col 3 to line 62, col 8 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `%%'.
    | line 63, col 5 to line 63, col 5 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '*'.
    | line 63, col 3 to line 63, col 7 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `*'.
    | line 64, col 5 to line 64, col 6 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '**'.
    | line 64, col 3 to line 64, col 8 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `**'.
    | line 65, col 3 to line 65, col 3 of module infix_op_infix_operator_application
    | Unknown operator: `x'.
    | line 65, col 8 to line 65, col 8 of module infix_op_infix_operator_application
    | Unknown operator: `y'.
    | line 66, col 3 to line 66, col 3 of module infix_op_infix_operator_application
    | Unknown operator: `x'.
    | line 66, col 7 to line 66, col 7 of module infix_op_infix_operator_application
    | Unknown operator: `y'.
    | line 67, col 3 to line 67, col 3 of module infix_op_infix_operator_application
    | Unknown operator: `x'.
    | line 67, col 12 to line 67, col 12 of module infix_op_infix_operator_application
    | Unknown operator: `y'.
    | line 68, col 5 to line 68, col 7 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '(.)'.
    | line 68, col 3 to line 68, col 9 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `(.)'.
    | line 69, col 5 to line 69, col 9 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\odot'.
    | line 69, col 3 to line 69, col 11 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\odot'.
    | line 70, col 5 to line 70, col 7 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '(-)'.
    | line 70, col 3 to line 70, col 9 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `(-)'.
    | line 71, col 5 to line 71, col 11 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\ominus'.
    | line 71, col 3 to line 71, col 13 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\ominus'.
    | line 72, col 5 to line 72, col 7 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '(+)'.
    | line 72, col 3 to line 72, col 9 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `(+)'.
    | line 73, col 5 to line 73, col 10 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\oplus'.
    | line 73, col 3 to line 73, col 12 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\oplus'.
    | line 74, col 5 to line 74, col 7 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '(/)'.
    | line 74, col 3 to line 74, col 9 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `(/)'.
    | line 75, col 5 to line 75, col 11 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\oslash'.
    | line 75, col 3 to line 75, col 13 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\oslash'.
    | line 76, col 5 to line 76, col 8 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '(\X)'.
    | line 76, col 3 to line 76, col 10 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `(\X)'.
    | line 77, col 5 to line 77, col 11 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\otimes'.
    | line 77, col 3 to line 77, col 13 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\otimes'.
    | line 78, col 5 to line 78, col 5 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '+'.
    | line 78, col 3 to line 78, col 7 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `+'.
    | line 79, col 3 to line 79, col 3 of module infix_op_infix_operator_application
    | Unknown operator: `x'.
    | line 79, col 10 to line 79, col 10 of module infix_op_infix_operator_application
    | Unknown operator: `y'.
    | line 80, col 5 to line 80, col 6 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '++'.
    | line 80, col 3 to line 80, col 8 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `++'.
    | line 81, col 5 to line 81, col 5 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '^'.
    | line 81, col 3 to line 81, col 7 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `^'.
    | line 82, col 5 to line 82, col 6 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '^^'.
    | line 82, col 3 to line 82, col 8 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `^^'.
    | line 83, col 5 to line 83, col 9 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\prec'.
    | line 83, col 3 to line 83, col 11 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\prec'.
    | line 84, col 5 to line 84, col 11 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\preceq'.
    | line 84, col 3 to line 84, col 13 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\preceq'.
    | line 85, col 5 to line 85, col 11 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\propto'.
    | line 85, col 3 to line 85, col 13 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\propto'.
    | line 86, col 5 to line 86, col 6 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '??'.
    | line 86, col 3 to line 86, col 8 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `??'.
    | line 87, col 5 to line 87, col 6 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '|='.
    | line 87, col 3 to line 87, col 8 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `|='.
    | line 88, col 5 to line 88, col 6 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '|-'.
    | line 88, col 3 to line 88, col 8 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `|-'.
    | line 89, col 3 to line 89, col 3 of module infix_op_infix_operator_application
    | Unknown operator: `x'.
    | line 89, col 7 to line 89, col 7 of module infix_op_infix_operator_application
    | Unknown operator: `y'.
    | line 90, col 5 to line 90, col 8 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\sim'.
    | line 90, col 3 to line 90, col 10 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\sim'.
    | line 91, col 5 to line 91, col 10 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\simeq'.
    | line 91, col 3 to line 91, col 12 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\simeq'.
    | line 92, col 5 to line 92, col 5 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '/'.
    | line 92, col 3 to line 92, col 7 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `/'.
    | line 93, col 5 to line 93, col 6 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '//'.
    | line 93, col 3 to line 93, col 8 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `//'.
    | line 94, col 5 to line 94, col 10 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\sqcap'.
    | line 94, col 3 to line 94, col 12 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\sqcap'.
    | line 95, col 5 to line 95, col 10 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\sqcup'.
    | line 95, col 3 to line 95, col 12 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\sqcup'.
    | line 96, col 5 to line 96, col 13 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\sqsubset'.
    | line 96, col 3 to line 96, col 15 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\sqsubset'.
    | line 97, col 5 to line 97, col 15 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\sqsubseteq'.
    | line 97, col 3 to line 97, col 17 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\sqsubseteq'.
    | line 98, col 5 to line 98, col 13 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\sqsupset'.
    | line 98, col 3 to line 98, col 15 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\sqsupset'.
    | line 99, col 5 to line 99, col 15 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\sqsupseteq'.
    | line 99, col 3 to line 99, col 17 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\sqsupseteq'.
    | line 100, col 5 to line 100, col 9 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\star'.
    | line 100, col 3 to line 100, col 11 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\star'.
    | line 101, col 5 to line 101, col 11 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\subset'.
    | line 101, col 3 to line 101, col 13 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\subset'.
    | line 102, col 3 to line 102, col 3 of module infix_op_infix_operator_application
    | Unknown operator: `x'.
    | line 102, col 15 to line 102, col 15 of module infix_op_infix_operator_application
    | Unknown operator: `y'.
    | line 103, col 5 to line 103, col 9 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\succ'.
    | line 103, col 3 to line 103, col 11 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\succ'.
    | line 104, col 5 to line 104, col 11 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\succeq'.
    | line 104, col 3 to line 104, col 13 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\succeq'.
    | line 105, col 5 to line 105, col 11 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\supset'.
    | line 105, col 3 to line 105, col 13 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\supset'.
    | line 106, col 5 to line 106, col 13 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\supseteq'.
    | line 106, col 3 to line 106, col 15 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\supseteq'.
    | line 107, col 3 to line 107, col 3 of module infix_op_infix_operator_application
    | Unknown operator: `x'.
    | line 107, col 8 to line 107, col 8 of module infix_op_infix_operator_application
    | Unknown operator: `y'.
    | line 108, col 3 to line 108, col 3 of module infix_op_infix_operator_application
    | Unknown operator: `x'.
    | line 108, col 12 to line 108, col 12 of module infix_op_infix_operator_application
    | Unknown operator: `y'.
    | line 109, col 5 to line 109, col 10 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\uplus'.
    | line 109, col 3 to line 109, col 12 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\uplus'.
    | line 110, col 5 to line 110, col 5 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '|'.
    | line 110, col 3 to line 110, col 7 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `|'.
    | line 111, col 5 to line 111, col 6 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '||'.
    | line 111, col 3 to line 111, col 8 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `||'.
    | line 112, col 5 to line 112, col 7 of module infix_op_infix_operator_application
    | Could not find declaration or definition of symbol '\wr'.
    | line 112, col 3 to line 112, col 9 of module infix_op_infix_operator_application
    | Couldn't resolve infix operator symbol `\wr'.
    3002:1 Parsing or semantic analysis failed.
---*)
