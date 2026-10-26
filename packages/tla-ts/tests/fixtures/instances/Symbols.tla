------------------------------ MODULE Symbols ------------------------------
EXTENDS Integers

Plus == INSTANCE SymbolsInner WITH Neg <- -., Op <- +
Minus == INSTANCE SymbolsInner WITH Neg <- -., Op <- -
Subtract(a) == INSTANCE SymbolsInner WITH Neg <- -., Op <- -
LOCAL Times == INSTANCE SymbolsInner WITH Neg <- -., Op <- *
Quotient == INSTANCE SymbolsInner WITH Op <- \div, Neg <- -.
INSTANCE SymbolsInner WITH Neg <- -., Op <- -
ASSUME <<Plus!Applied, Plus!Passed, Plus!Negated, Plus!PassedNeg>> = <<5, 8, -5, -1>>
ASSUME <<Minus!Applied, Minus!Passed, Subtract(1)!Applied>> = <<-1, 0, -1>>
ASSUME <<Times!Applied, Quotient!Applied, Applied, PassedNeg>> = <<6, 0, -1, -1>>
ASSUME LET Power == INSTANCE SymbolsInner WITH Neg <- -., Op <- ^
           Sum == INSTANCE SymbolsInner WITH Neg <- -., Op <- -
           Difference == Sum!Passed
       IN  <<Power!Applied, Power!Passed, Sum!Applied, Difference>> = <<8, 256, -1, 0>>
ASSUME LET Sum == INSTANCE SymbolsInner WITH Neg <- -., Op <- + IN Sum!Passed = 8
Last == INSTANCE SymbolsInner WITH Neg <- -., Op <- -
=============================================================================
