import { PcalError, PcalBugError } from "../errors";
import {
  createNormalizedPcalExpr,
  createPcalBase,
  createPcalExpr,
  createPcalToken,
  getElement,
  getPcalLocation,
  getPcalTokenWidth,
  normalizePcalExpr,
  PCAL_TOKEN,
  substitutePcalExpr,
  toLabeledStmt,
  type PcalAlgorithm,
  type PcalAssign,
  type PcalCall,
  type PcalCallReturn,
  type PcalExpr,
  type PcalLabeledStmt,
  type PcalLabelEither,
  type PcalLabelIf,
  type PcalProcedure,
  type PcalProcess,
  type PcalPVarDecl,
  type PcalReturn,
  type PcalSingleAssign,
  type PcalStmt,
  type PcalToken,
  type PcalVarDecl,
  type PcalWhen,
  type PcalWhile,
} from "./ast";

const PCAL_SYMBOL = {
  global: 0,
  label: 1,
  procedure: 2,
  process: 3,
  processVar: 4,
  procedureVar: 5,
  parameter: 6,
} as const;

// PcalSymTab.Disambiguate loops one type past the last, as num_vtypes is 7.
const PCAL_SYMBOL_TYPE_COUNT = 7;

const PCAL_SYMBOL_TYPE_NAMES = [
  "Global variable",
  "Label",
  "Procedure",
  "Process",
  "Process variable",
  "Procedure variable",
  "Parameter",
];

const PCAL_VARIABLE_SYMBOLS = new Set<number>([
  PCAL_SYMBOL.global,
  PCAL_SYMBOL.processVar,
  PCAL_SYMBOL.procedureVar,
  PCAL_SYMBOL.parameter,
]);

interface PcalSymbol {
  type: number;
  id: string;
  context: string;
  useThis: string;
}

interface PcalProcedureEntry {
  name: string;
  params: PcalPVarDecl[];
  decls: PcalPVarDecl[];
  initialPC: string | undefined;
}

interface PcalSymbolTable {
  symbols: PcalSymbol[];
  procedures: PcalProcedureEntry[];
  processNames: string[];
  errorReport: string;
}

const findSymbol = (
  table: PcalSymbolTable,
  type: number,
  id: string | undefined,
  context: string,
) =>
  table.symbols.find(
    (symbol) => symbol.id === id && symbol.context === context && symbol.type === type,
  );

const findSymbolInContext = (table: PcalSymbolTable, id: string, context: string) =>
  table.symbols.find((symbol) => symbol.id === id && symbol.context === context);

const findProcedureIndex = (table: PcalSymbolTable, name: string) => {
  const index = table.procedures.findIndex((procedure) => procedure.name === name);
  return index === -1 ? table.procedures.length : index;
};

const insertSymbol = (table: PcalSymbolTable, type: number, id: string, context: string) => {
  const isVariable =
    type === PCAL_SYMBOL.procedureVar ||
    type === PCAL_SYMBOL.processVar ||
    type === PCAL_SYMBOL.parameter;
  const isDefined = isVariable
    ? findSymbol(table, PCAL_SYMBOL.global, id, "") !== undefined ||
      findSymbolInContext(table, id, context) !== undefined
    : findSymbol(table, type, id, context) !== undefined;
  if (isDefined) return false;
  table.symbols.push({ type, id, context, useThis: id });
  return true;
};

const useThis = (table: PcalSymbolTable, type: number, id: string, context: string) =>
  findSymbol(table, type, id, context)?.useThis ?? id;

const useThisVar = (table: PcalSymbolTable, id: string, context: string) => {
  const symbol = findSymbolInContext(table, id, context);
  if (symbol === undefined) return id;
  return PCAL_VARIABLE_SYMBOLS.has(symbol.type) ? symbol.useThis : id;
};

const createPcalSymbolTable = (ast: PcalAlgorithm) => {
  const table: PcalSymbolTable = {
    symbols: [],
    procedures: [],
    processNames: [],
    errorReport: "",
  };

  const extractLabeledStmt = (labeledStmt: PcalLabeledStmt, context: string) => {
    if (!insertSymbol(table, PCAL_SYMBOL.label, labeledStmt.label, context)) {
      table.errorReport += `\nLabel ${labeledStmt.label} redefined at line ${labeledStmt.line}, column ${labeledStmt.col}`;
    }
    labeledStmt.stmts.forEach((stmt) => extractStmt(stmt, context));
  };

  const extractStmt = (stmt: PcalStmt, context: string): void => {
    const extractStmts = (stmts: PcalStmt[]) =>
      stmts.forEach((innerStmt) => extractStmt(innerStmt, context));
    const extractLabeledStmts = (stmts: PcalLabeledStmt[]) =>
      stmts.forEach((innerStmt) => extractLabeledStmt(innerStmt, context));
    switch (stmt.kind) {
      case "While":
        extractStmts(stmt.unlabDo);
        extractLabeledStmts(stmt.labDo);
        return;
      case "If":
        extractStmts(stmt.Then);
        extractStmts(stmt.Else);
        return;
      case "With":
        extractStmts(stmt.Do);
        return;
      case "LabelIf":
        extractStmts(stmt.unlabThen);
        extractLabeledStmts(stmt.labThen);
        extractStmts(stmt.unlabElse);
        extractLabeledStmts(stmt.labElse);
        return;
      case "Either":
        stmt.ors.forEach(extractStmts);
        return;
      case "LabelEither":
        stmt.clauses.forEach((clause) => {
          extractStmts(clause.unlabOr);
          extractLabeledStmts(clause.labOr);
        });
        return;
      case "Assign":
      case "When":
      case "PrintS":
      case "Assert":
      case "Skip":
      case "Call":
      case "Return":
      case "CallReturn":
      case "CallGoto":
      case "Goto":
        return;
      default:
        throw new PcalBugError(`Unexpected AST type ${stmt.kind}`);
    }
  };

  const extractVarDecl = (
    decl: PcalVarDecl | PcalPVarDecl,
    context: string,
    type: number = context === "" ? PCAL_SYMBOL.global : PCAL_SYMBOL.processVar,
  ) => {
    if (!insertSymbol(table, type, decl.var, context)) {
      table.errorReport += `\n${PCAL_SYMBOL_TYPE_NAMES[type]} ${decl.var} redefined at line ${decl.line}, column ${decl.col}`;
    }
  };

  const extractProcedure = (procedure: PcalProcedure) => {
    const isRedefined = findProcedureIndex(table, procedure.name) < table.procedures.length;
    if (isRedefined) {
      table.errorReport += `\nProcedure ${procedure.name} redefined at line ${procedure.line}, column ${procedure.col}`;
    }
    if (!isRedefined) {
      table.procedures.push({
        name: procedure.name,
        params: procedure.params,
        decls: procedure.decls,
        initialPC: procedure.body.length === 0 ? undefined : toLabeledStmt(procedure.body[0]).label,
      });
    }
    insertSymbol(table, PCAL_SYMBOL.procedure, procedure.name, "");
    procedure.decls.forEach((decl) =>
      extractVarDecl(decl, procedure.name, PCAL_SYMBOL.procedureVar),
    );
    procedure.params.forEach((param) =>
      extractVarDecl(param, procedure.name, PCAL_SYMBOL.parameter),
    );
    procedure.body.forEach((stmt) => extractLabeledStmt(toLabeledStmt(stmt), procedure.name));
  };

  const extractProcess = (process: PcalProcess) => {
    const isRedefined = table.processNames.includes(process.name);
    if (isRedefined) {
      table.errorReport += `\nProcess ${process.name} redefined at line ${process.line}, column ${process.col}`;
    }
    if (!isRedefined) table.processNames.push(process.name);
    insertSymbol(table, PCAL_SYMBOL.process, process.name, "");
    process.decls.forEach((decl) => extractVarDecl(decl, process.name));
    process.body.forEach((stmt) => extractLabeledStmt(toLabeledStmt(stmt), process.name));
  };

  insertSymbol(table, PCAL_SYMBOL.global, "pc", "");
  if (ast.prcds.length > 0) insertSymbol(table, PCAL_SYMBOL.global, "stack", "");
  ast.decls.forEach((decl) => extractVarDecl(decl, ""));
  ast.prcds.forEach(extractProcedure);
  if (ast.kind === "Multiprocess") ast.procs.forEach(extractProcess);
  if (ast.kind === "Uniprocess") {
    ast.body.forEach((stmt) => extractLabeledStmt(toLabeledStmt(stmt), ""));
  }
  if (table.errorReport.length > 0) throw new PcalError(table.errorReport);
  return table;
};

const disambiguatePcalSymbols = (table: PcalSymbolTable) => {
  const isAmbiguous = (id: string) =>
    table.symbols.filter((symbol) => symbol.useThis === id).length > 1;
  let isRenamed = false;
  for (let type = 0; type <= PCAL_SYMBOL_TYPE_COUNT; type += 1) {
    table.symbols.forEach((symbol) => {
      if (symbol.type !== type) return;
      symbol.useThis = symbol.id;
      for (let suffixLength = 1; type > 0 && isAmbiguous(symbol.useThis); suffixLength += 1) {
        symbol.useThis +=
          suffixLength === 1 ? "_" : (symbol.context[suffixLength - 2] ?? String(type));
      }
      if (symbol.id !== symbol.useThis) isRenamed = true;
    });
  }
  return isRenamed;
};

const checkForDefaultInitValue = (table: PcalSymbolTable) => {
  const uses = table.symbols
    .filter((symbol) => symbol.id === "defaultInitValue")
    .map((symbol) => `${PCAL_SYMBOL_TYPE_NAMES[symbol.type]} name`);
  if (uses.length > 0) {
    throw new PcalError(`Cannot use \`defaultInitValue' as ${uses.join(" or ")}`);
  }
};

const fixPcalIds = (ast: PcalAlgorithm, table: PcalSymbolTable, log: (line: string) => void) => {
  const fixExpr = (expr: PcalExpr, context: string) => {
    const names: string[] = [];
    const replacements: PcalExpr[] = [];
    expr.tokens.forEach((line) =>
      line.forEach((token) => {
        if (token.type !== PCAL_TOKEN.ident) return;
        const useMe = useThisVar(table, token.string, context);
        if (names.includes(token.string) || useMe === token.string) return;
        names.push(token.string);
        replacements.push(createNormalizedPcalExpr([[createIdentToken(useMe)]]));
      }),
    );
    if (replacements.length > 0) substitutePcalExpr(expr, replacements, names, false);
  };

  const fixVarDecl = (decl: PcalVarDecl | PcalPVarDecl, context: string) => {
    decl.var = useThisVar(table, decl.var, context);
    fixExpr(decl.val, context);
  };

  const fixLabels = (labels: string[], context: string) =>
    labels.forEach((label, index) => {
      labels[index] = useThis(table, PCAL_SYMBOL.label, label, context);
    });

  const fixProcedureName = (name: string | undefined, context: string) =>
    name === undefined ? undefined : useThis(table, PCAL_SYMBOL.procedure, name, context);

  const fixLabeledStmt = (labeledStmt: PcalLabeledStmt, context: string) => {
    labeledStmt.label = useThis(table, PCAL_SYMBOL.label, labeledStmt.label, context);
    labeledStmt.stmts.forEach((stmt) => fixStmt(stmt, context));
  };

  const fixStmt = (stmt: PcalStmt, context: string): void => {
    const fixStmts = (stmts: PcalStmt[]) =>
      stmts.forEach((innerStmt) => fixStmt(innerStmt, context));
    const fixLabeledStmts = (stmts: PcalLabeledStmt[]) =>
      stmts.forEach((innerStmt) => fixLabeledStmt(innerStmt, context));
    const fixExprs = (exprs: PcalExpr[]) => exprs.forEach((expr) => fixExpr(expr, context));
    switch (stmt.kind) {
      case "LabeledStmt":
        fixLabeledStmt(stmt, context);
        return;
      case "While":
        fixStmts(stmt.unlabDo);
        fixLabeledStmts(stmt.labDo);
        fixExpr(stmt.test, context);
        return;
      case "Assign":
        stmt.ass.forEach((assign) => {
          assign.lhs.var = useThisVar(table, assign.lhs.var, context);
          fixExpr(assign.lhs.sub, context);
          fixExpr(assign.rhs, context);
        });
        return;
      case "If":
        fixStmts(stmt.Then);
        fixStmts(stmt.Else);
        fixExpr(stmt.test, context);
        return;
      case "With":
        fixExpr(stmt.exp, context);
        fixStmts(stmt.Do);
        return;
      case "When":
      case "PrintS":
      case "Assert":
        fixExpr(stmt.exp, context);
        return;
      case "Skip":
        return;
      case "LabelIf":
        fixExpr(stmt.test, context);
        fixStmts(stmt.unlabThen);
        fixLabeledStmts(stmt.labThen);
        fixStmts(stmt.unlabElse);
        fixLabeledStmts(stmt.labElse);
        return;
      case "Call":
        stmt.returnTo = useThis(table, PCAL_SYMBOL.procedure, stmt.returnTo, context);
        stmt.to = useThis(table, PCAL_SYMBOL.procedure, stmt.to, context);
        fixExprs(stmt.args);
        return;
      case "Return":
        stmt.from = fixProcedureName(stmt.from, context);
        return;
      case "CallReturn":
        stmt.from = fixProcedureName(stmt.from, context);
        stmt.to = useThis(table, PCAL_SYMBOL.procedure, stmt.to, context);
        fixExprs(stmt.args);
        return;
      case "CallGoto":
        stmt.after = useThis(table, PCAL_SYMBOL.procedure, stmt.after, context);
        stmt.to = useThis(table, PCAL_SYMBOL.procedure, stmt.to, context);
        fixExprs(stmt.args);
        return;
      case "Goto":
        if (
          findSymbol(table, PCAL_SYMBOL.label, stmt.to, context) === undefined &&
          stmt.to !== "Done"
        ) {
          throw new PcalError(
            `goto to non-existent label \`${stmt.to}' at line ${stmt.line}, column ${stmt.col}`,
          );
        }
        stmt.to = useThis(table, PCAL_SYMBOL.label, stmt.to, context);
        return;
      case "Either":
        stmt.ors.forEach(fixStmts);
        return;
      case "LabelEither":
        stmt.clauses.forEach((clause) => {
          fixStmts(clause.unlabOr);
          fixLabeledStmts(clause.labOr);
        });
        return;
      default:
        throw new PcalBugError(`Unexpected AST type${stmt.kind}`);
    }
  };

  const fixProcedure = (procedure: PcalProcedure) => {
    procedure.decls.forEach((decl) => fixVarDecl(decl, procedure.name));
    procedure.params.forEach((param) => fixVarDecl(param, procedure.name));
    procedure.body.forEach((stmt) => fixLabeledStmt(toLabeledStmt(stmt), procedure.name));
    const entry = getElement(table.procedures, findProcedureIndex(table, procedure.name));
    fixLabels(procedure.plusLabels, procedure.name);
    fixLabels(procedure.minusLabels, procedure.name);
    if (entry.initialPC !== undefined) {
      entry.initialPC = useThis(table, PCAL_SYMBOL.label, entry.initialPC, procedure.name);
    }
    procedure.name = useThis(table, PCAL_SYMBOL.procedure, procedure.name, "");
    entry.name = procedure.name;
  };

  const fixProcess = (process: PcalProcess) => {
    process.decls.forEach((decl) => fixVarDecl(decl, process.name));
    process.body.forEach((stmt) => fixLabeledStmt(toLabeledStmt(stmt), process.name));
    fixLabels(process.plusLabels, process.name);
    fixLabels(process.minusLabels, process.name);
    process.name = useThis(table, PCAL_SYMBOL.process, process.name, "");
  };

  const fixMultiprocess = (procedures: PcalProcedure[], processes: PcalProcess[]) => {
    procedures.forEach(fixProcedure);
    const procedureNames = procedures.map((procedure) => procedure.name);
    const isCalled = procedures.map((procedure) =>
      procedureNames.map((name) => procedure.proceduresCalled.includes(name)),
    );
    procedureNames.forEach((_name, middle) =>
      isCalled.forEach((row) =>
        row.forEach((isPath, end) => {
          row[end] = isPath || (row[middle] && isCalled[middle][end]);
        }),
      ),
    );
    procedures.forEach((procedure, index) => {
      procedure.proceduresCalled = procedureNames.filter(
        (_name, calleeIndex) => isCalled[index][calleeIndex],
      );
    });
    for (const process of processes) {
      fixProcess(process);
      const called = process.proceduresCalled;
      for (let calledIndex = 0; calledIndex < called.length; calledIndex += 1) {
        const procedureIndex = procedureNames.indexOf(called[calledIndex]);
        if (procedureIndex === -1) {
          log(
            `\nUnrecoverable error:\n -- Could not find procedure name \`${called[calledIndex]}'.\n`,
          );
          return;
        }
        procedureNames.forEach((callee, calleeIndex) => {
          if (isCalled[procedureIndex][calleeIndex] && !called.includes(callee))
            called.push(callee);
        });
      }
    }
  };

  ast.decls.forEach((decl) => fixVarDecl(decl, ""));
  if (ast.kind === "Multiprocess") fixMultiprocess(ast.prcds, ast.procs);
  if (ast.kind === "Uniprocess") {
    ast.prcds.forEach(fixProcedure);
    ast.body.forEach((stmt) => fixLabeledStmt(toLabeledStmt(stmt), ""));
  }
};

const createStringToken = (string: string) => createPcalToken(string, 0, PCAL_TOKEN.string);
const createAddedToken = (string: string) => createPcalToken(string, 0, PCAL_TOKEN.added);
const createBuiltInToken = (string: string) => createPcalToken(string, 0, PCAL_TOKEN.builtin);
const createIdentToken = (string: string) => createPcalToken(string, 0, PCAL_TOKEN.ident);

const tokensToExpr = (tokens: PcalToken[], spaces: number) => {
  const line: PcalToken[] = [];
  tokens.forEach((token) => {
    const previous = line.at(-1);
    const column =
      previous === undefined ? 0 : previous.column + getPcalTokenWidth(previous) + spaces;
    line.push(createPcalToken(token.string, column, token.type));
  });
  return createNormalizedPcalExpr([line]);
};

const prettifyStackTopExpr = (expr: PcalExpr) =>
  expr.tokens.forEach((line, lineIndex) => {
    let column = lineIndex === 0 || lineIndex === expr.tokens.length - 1 ? 1 : 6;
    line.forEach((token) => {
      token.column = column;
      column += getPcalTokenWidth(token);
      if (token.type !== PCAL_TOKEN.builtin) return;
      switch (token.string) {
        case "|->":
        case "↦":
          token.column = Math.max(16, token.column + 1);
          column = token.column + 5;
          return;
        case "[":
        case "<<":
          column += 1;
          return;
        case "]":
        case ">>":
          token.column += 1;
          column += 1;
          return;
        case "\\o":
          token.column += 1;
          column += 2;
      }
    });
  });

const createSingleAssign = (
  variable: string,
  sub: PcalExpr,
  rhs: PcalExpr,
  line = 0,
  col = 0,
): PcalSingleAssign => ({
  ...createPcalBase(),
  kind: "SingleAssign",
  line,
  col,
  lhs: { ...createPcalBase(), kind: "Lhs", var: variable, sub },
  rhs,
});

const createAssign = (assigns: PcalSingleAssign[], line = 0, col = 0): PcalAssign => ({
  ...createPcalBase(),
  kind: "Assign",
  line,
  col,
  ass: assigns,
});

const makeAssign = (variable: string, expr: PcalExpr, line = 0, col = 0) =>
  createAssign(
    [createSingleAssign(variable, createNormalizedPcalExpr([]), expr, line, col)],
    line,
    col,
  );

const isTrue = (expr: PcalExpr) => {
  if (expr.tokens.length > 1) return false;
  const line = getElement(expr.tokens, 0);
  if (line.length === 1) return line[0].string === "TRUE";
  if (line.length === 3) {
    return line[0].string === "(" && line[1].string === "TRUE" && line[2].string === ")";
  }
  return false;
};

const createPCCheck = (label: string): PcalWhen => ({
  ...createPcalBase(),
  kind: "When",
  exp: tokensToExpr([createAddedToken("pc"), createBuiltInToken("="), createStringToken(label)], 1),
});

// HACK: PcalSymTab.ProcedureEntry leaves iPC null for a procedure with no statements, which
// StringToken keeps and AST.toString prints as "null".
const createPCUpdate = (next: string | undefined) =>
  makeAssign("pc", createNormalizedPcalExpr([[createStringToken(next ?? "null")]]));

const getStackHeadTokens = (field: string) => [
  createIdentToken("Head"),
  createBuiltInToken("("),
  createAddedToken("stack"),
  createBuiltInToken(")"),
  createBuiltInToken("."),
  createIdentToken(field),
];

const getStackTailTokens = () => [
  createIdentToken("Tail"),
  createBuiltInToken("("),
  createAddedToken("stack"),
  createBuiltInToken(")"),
];

const createStackHeadExpr = (field: string) =>
  createNormalizedPcalExpr([getStackHeadTokens(field)]);

const createStackPushExpr = (
  procedure: string,
  pcTokens: PcalToken[],
  variables: PcalPVarDecl[],
  tailTokens: PcalToken[],
) => {
  const tokens: PcalToken[][] = [
    [
      createBuiltInToken("<<"),
      createBuiltInToken("["),
      createIdentToken("procedure"),
      createBuiltInToken("|->"),
      createStringToken(procedure),
      createBuiltInToken(","),
    ],
    [createIdentToken("pc"), createBuiltInToken("|->"), ...pcTokens],
  ];
  variables.forEach((variable) => {
    tokens[tokens.length - 1].push(createBuiltInToken(","));
    tokens.push([
      createIdentToken(variable.var),
      createBuiltInToken("|->"),
      createIdentToken(variable.var),
    ]);
  });
  tokens[tokens.length - 1].push(createBuiltInToken("]"), createBuiltInToken(">>"));
  tokens.push(tailTokens);
  const expr = createPcalExpr(tokens);
  prettifyStackTopExpr(expr);
  normalizePcalExpr(expr);
  return expr;
};

const createCallStmts = (
  assign: PcalAssign,
  entry: PcalProcedureEntry,
  call: PcalCall | PcalCallReturn,
) => {
  if (entry.params.length !== call.args.length) {
    throw new PcalError(`Procedure ${call.to} called with wrong number of arguments`, call);
  }
  entry.params.forEach((param, index) =>
    assign.ass.push(
      createSingleAssign(
        param.var,
        createNormalizedPcalExpr([]),
        call.args[index],
        call.line,
        call.col,
      ),
    ),
  );
  return [
    assign,
    ...entry.decls.map((decl) => makeAssign(decl.var, decl.val, call.line, call.col)),
    createPCUpdate(entry.initialPC),
  ];
};

interface PcalExplodedStmts {
  stmts: PcalStmt[];
  labeledStmts: PcalLabeledStmt[];
  needsGoto: boolean;
}

const explodePcalAlgorithm = (
  ast: PcalAlgorithm,
  table: PcalSymbolTable,
  shouldOmitPC: boolean,
): PcalAlgorithm => {
  let currentProcedure: string | undefined;

  const explodeCall = (call: PcalCall, next: string) => {
    const procedureIndex = findProcedureIndex(table, call.to);
    if (procedureIndex === table.procedures.length) {
      throw new PcalError(`Call of non-existent procedure ${call.to}`, call);
    }
    const entry = table.procedures[procedureIndex];
    const stackPush = createStackPushExpr(
      call.to,
      [createStringToken(next)],
      [...entry.decls, ...entry.params],
      [createBuiltInToken("\\o"), createAddedToken("stack")],
    );
    return createCallStmts(makeAssign("stack", stackPush, call.line, call.col), entry, call);
  };

  const explodeReturn = (stmt: PcalReturn) => {
    stmt.from ??= currentProcedure;
    const from = stmt.from;
    if (from === undefined) throw new PcalError("`return' statement not in procedure", stmt);
    const procedureIndex = findProcedureIndex(table, from);
    if (procedureIndex >= table.procedures.length) {
      throw new PcalError("Error in procedure (perhaps name used elsewhere)", stmt);
    }
    const entry = table.procedures[procedureIndex];
    const restore = (variable: string, rhs: PcalExpr) =>
      createAssign(
        [createSingleAssign(variable, createPcalExpr(), rhs, stmt.line, stmt.col)],
        stmt.line,
        stmt.col,
      );
    return [
      restore("pc", createStackHeadExpr("pc")),
      ...entry.decls.map((decl) => restore(decl.var, createStackHeadExpr(decl.var))),
      ...entry.params.map((param) => restore(param.var, createStackHeadExpr(param.var))),
      restore("stack", createNormalizedPcalExpr([getStackTailTokens()])),
    ];
  };

  const explodeCallReturn = (stmt: PcalCallReturn) => {
    const from = stmt.from;
    if (from === undefined) {
      throw new PcalError(
        `\`return' statement following \`call' at ${getPcalLocation(stmt)} not in a procedure`,
      );
    }
    const fromEntry = getElement(table.procedures, findProcedureIndex(table, from));
    const toIndex = findProcedureIndex(table, stmt.to);
    if (toIndex === table.procedures.length) {
      throw new PcalError(`Call of non-existent procedure ${stmt.to}`, stmt);
    }
    const toEntry = table.procedures[toIndex];
    const assign = createAssign([], stmt.line, stmt.col);
    if (from !== stmt.to) {
      fromEntry.decls.forEach((decl) =>
        assign.ass.push(
          createSingleAssign(
            decl.var,
            createPcalExpr(),
            createStackHeadExpr(decl.var),
            stmt.line,
            stmt.col,
          ),
        ),
      );
      const stackPush = createStackPushExpr(
        stmt.to,
        getStackHeadTokens("pc"),
        [...toEntry.decls, ...toEntry.params],
        [createBuiltInToken("\\o"), ...getStackTailTokens()],
      );
      assign.ass.push(
        createSingleAssign("stack", createNormalizedPcalExpr([]), stackPush, stmt.line, stmt.col),
      );
    }
    return createCallStmts(assign, toEntry, stmt);
  };

  const copyAndExplodeLastStmt = (stmts: PcalStmt[], next: string): PcalExplodedStmts => {
    if (stmts.length === 0) return { stmts: [], labeledStmts: [], needsGoto: !shouldOmitPC };
    const result: PcalExplodedStmts = { stmts, labeledStmts: [], needsGoto: false };
    const last = stmts[stmts.length - 1];
    switch (last.kind) {
      case "LabelIf":
      case "LabelEither": {
        const exploded =
          last.kind === "LabelIf" ? explodeLabelIf(last, next) : explodeLabelEither(last, next);
        stmts.pop();
        stmts.push(exploded.stmt);
        result.labeledStmts = exploded.labeledStmts;
        break;
      }
      case "Goto":
        stmts.pop();
        stmts.push(createPCUpdate(last.to));
        break;
      case "Call":
        stmts.pop();
        stmts.push(...explodeCall(last, next));
        break;
      case "Return":
        stmts.pop();
        stmts.push(...explodeReturn(last));
        break;
      case "CallReturn":
        stmts.pop();
        stmts.push(...explodeCallReturn(last));
        break;
      case "CallGoto":
        stmts.pop();
        stmts.push(
          ...explodeCall(
            {
              ...createPcalBase(),
              kind: "Call",
              returnTo: "",
              to: last.to,
              args: last.args,
              line: last.line,
              col: last.col,
            },
            last.after,
          ),
        );
        break;
      case "If": {
        const explodedThen = copyAndExplodeLastStmt(last.Then, next);
        const explodedElse = copyAndExplodeLastStmt(last.Else, next);
        result.labeledStmts.push(...explodedThen.labeledStmts, ...explodedElse.labeledStmts);
        last.Then = explodedThen.stmts;
        last.Else = explodedElse.stmts;
        if (!shouldOmitPC) {
          result.needsGoto = explodedThen.needsGoto && explodedElse.needsGoto;
          if (!result.needsGoto) {
            if (explodedThen.needsGoto) last.Then.push(createPCUpdate(next));
            if (explodedElse.needsGoto) last.Else.push(createPCUpdate(next));
          }
        }
        break;
      }
      case "Either": {
        const explodedOrs = last.ors.map((orStmts, index) => {
          const exploded = copyAndExplodeLastStmt(orStmts, next);
          last.ors[index] = exploded.stmts;
          result.labeledStmts.push(...exploded.labeledStmts);
          return exploded;
        });
        result.needsGoto = explodedOrs.every((exploded) => exploded.needsGoto);
        if (!shouldOmitPC && !result.needsGoto) {
          explodedOrs.forEach((exploded, index) => {
            if (exploded.needsGoto) last.ors[index].push(createPCUpdate(next));
          });
        }
        break;
      }
      case "With": {
        const exploded = copyAndExplodeLastStmt(last.Do, next);
        last.Do = exploded.stmts;
        result.labeledStmts.push(...exploded.labeledStmts);
        result.needsGoto = exploded.needsGoto;
        break;
      }
      default:
        result.needsGoto = true;
    }
    if (shouldOmitPC) result.needsGoto = false;
    return result;
  };

  const copyAndExplodeLastStmtWithGoto = (stmts: PcalStmt[], next: string) => {
    const exploded = copyAndExplodeLastStmt(stmts, next);
    if (exploded.needsGoto) exploded.stmts.push(createPCUpdate(next));
    return exploded;
  };

  const explodeLabeledStmt = (labeledStmt: PcalLabeledStmt, next: string): PcalLabeledStmt[] => {
    const first = labeledStmt.stmts.at(0);
    if (first?.kind === "While") return explodeWhile(labeledStmt, first, next);
    const exploded = copyAndExplodeLastStmtWithGoto([...labeledStmt.stmts], next);
    const result: PcalLabeledStmt[] = [];
    if (!shouldOmitPC) {
      exploded.stmts.unshift(createPCCheck(labeledStmt.label));
      result.push({
        ...createPcalBase(),
        kind: "LabeledStmt",
        col: labeledStmt.col,
        line: labeledStmt.line,
        label: labeledStmt.label,
        stmts: exploded.stmts,
      });
    }
    result.push(...exploded.labeledStmts);
    return result;
  };

  const explodeLabeledStmtSeq = (seq: PcalLabeledStmt[], next: string) =>
    seq.flatMap((labeledStmt, index) =>
      explodeLabeledStmt(labeledStmt, index < seq.length - 1 ? seq[index + 1].label : next),
    );

  const explodeWhile = (labeledStmt: PcalLabeledStmt, loop: PcalWhile, next: string) => {
    const unlabDoNext = loop.labDo.length === 0 ? labeledStmt.label : loop.labDo[0].label;
    const explodedBody = copyAndExplodeLastStmtWithGoto([...loop.unlabDo], unlabDoNext);
    const explodedRest = copyAndExplodeLastStmtWithGoto(labeledStmt.stmts.slice(1), next);
    const isForever = isTrue(loop.test);
    const loopStmts: PcalStmt[] = isForever
      ? explodedBody.stmts
      : [
          {
            ...createPcalBase(),
            kind: "If",
            test: loop.test,
            Then: explodedBody.stmts,
            Else: explodedRest.stmts,
          },
        ];
    const newLabeledStmt: PcalLabeledStmt = {
      ...createPcalBase(),
      kind: "LabeledStmt",
      col: labeledStmt.col,
      line: labeledStmt.line,
      label: labeledStmt.label,
      stmts: [...(shouldOmitPC ? [] : [createPCCheck(labeledStmt.label)]), ...loopStmts],
    };
    return [
      newLabeledStmt,
      ...explodeLabeledStmtSeq(loop.labDo, labeledStmt.label),
      ...explodedBody.labeledStmts,
      ...(isForever ? [] : explodedRest.labeledStmts),
    ];
  };

  const explodeLabelIf = (stmt: PcalLabelIf, next: string) => {
    const explodedThen = copyAndExplodeLastStmtWithGoto(
      stmt.unlabThen,
      stmt.labThen.length === 0 ? next : stmt.labThen[0].label,
    );
    const explodedElse = copyAndExplodeLastStmtWithGoto(
      stmt.unlabElse,
      stmt.labElse.length === 0 ? next : stmt.labElse[0].label,
    );
    const labeledStmts = explodeLabeledStmtSeq(stmt.labThen, next);
    labeledStmts.push(...explodeLabeledStmtSeq(stmt.labElse, next));
    labeledStmts.push(...explodedThen.labeledStmts, ...explodedElse.labeledStmts);
    const newIf: PcalStmt = {
      ...createPcalBase(),
      kind: "If",
      col: stmt.col,
      line: stmt.line,
      test: stmt.test,
      Then: explodedThen.stmts,
      Else: explodedElse.stmts,
    };
    return { stmt: newIf, labeledStmts };
  };

  const explodeLabelEither = (stmt: PcalLabelEither, next: string) => {
    const ors: PcalStmt[][] = [];
    const labeledStmts: PcalLabeledStmt[] = [];
    stmt.clauses.forEach((clause) => {
      const exploded = copyAndExplodeLastStmtWithGoto(
        clause.unlabOr,
        clause.labOr.length > 0 ? clause.labOr[0].label : next,
      );
      ors.push(exploded.stmts);
      labeledStmts.push(...exploded.labeledStmts);
      labeledStmts.push(...explodeLabeledStmtSeq(clause.labOr, next));
    });
    const newEither: PcalStmt = {
      ...createPcalBase(),
      kind: "Either",
      col: stmt.col,
      line: stmt.line,
      ors,
    };
    return { stmt: newEither, labeledStmts };
  };

  const explodeBody = (body: PcalStmt[], next: string) =>
    explodeLabeledStmtSeq(body.map(toLabeledStmt), next);

  const explodeProcedure = (procedure: PcalProcedure): PcalProcedure => {
    currentProcedure = procedure.name;
    const body = explodeBody(procedure.body, useThis(table, PCAL_SYMBOL.label, "Error", ""));
    currentProcedure = undefined;
    return {
      ...createPcalBase(),
      kind: "Procedure",
      col: procedure.col,
      line: procedure.line,
      name: procedure.name,
      minusLabels: [],
      plusLabels: [],
      proceduresCalled: [],
      params: procedure.params,
      decls: procedure.decls,
      body,
    };
  };

  const explodeProcess = (process: PcalProcess): PcalProcess => ({
    ...createPcalBase(),
    kind: "Process",
    col: process.col,
    line: process.line,
    name: process.name,
    fairness: 0,
    minusLabels: [],
    plusLabels: [],
    proceduresCalled: [],
    isEq: process.isEq,
    id: process.id,
    decls: process.decls,
    body: explodeBody(process.body, "Done"),
  });

  const prcds = ast.prcds.map(explodeProcedure);
  if (ast.kind === "Uniprocess") {
    return {
      ...createPcalBase(),
      kind: "Uniprocess",
      col: ast.col,
      line: ast.line,
      name: ast.name,
      decls: ast.decls,
      defs: ast.defs,
      macros: [],
      prcds,
      body: explodeBody(ast.body, "Done"),
    };
  }
  return {
    ...createPcalBase(),
    kind: "Multiprocess",
    col: ast.col,
    line: ast.line,
    name: ast.name,
    decls: ast.decls,
    defs: ast.defs,
    macros: [],
    prcds,
    procs: ast.procs.map(explodeProcess),
  };
};

const checkPcalTlaGen = (explodedAst: PcalAlgorithm, shouldOmitPC: boolean) => {
  const vars = shouldOmitPC ? [] : ["pc"];
  vars.push(...explodedAst.decls.map((decl) => decl.var));
  if (explodedAst.prcds.length > 0) vars.push("stack");
  explodedAst.prcds.forEach((procedure) => {
    vars.push(...procedure.params.map((param) => param.var));
    vars.push(...procedure.decls.map((decl) => decl.var));
  });
  if (explodedAst.kind === "Multiprocess") {
    explodedAst.procs.forEach((process) => vars.push(...process.decls.map((decl) => decl.var)));
  }
  if (vars.length === 0) throw new PcalError("The algorithm has no variables.");

  const setChanged = (changed: number[], variable: string) => {
    const index = vars.indexOf(variable);
    if (index === -1) return 0;
    changed[index] += 1;
    return changed[index];
  };

  const mergeChanged = (changed: number[], other: number[]) =>
    other.forEach((count, index) => {
      changed[index] = Math.max(changed[index], count);
    });

  const sortSingleAssigns = (assigns: PcalSingleAssign[]) =>
    [...assigns].sort((left, right) =>
      left.lhs.var < right.lhs.var ? -1 : left.lhs.var > right.lhs.var ? 1 : 0,
    );

  const checkAssign = (assign: PcalAssign, changed: number[]) => {
    const thisChanged = [...changed];
    assign.ass = sortSingleAssigns(assign.ass);
    new Set(assign.ass.map((single) => single.lhs.var)).forEach((variable) => {
      const group = assign.ass.filter((single) => single.lhs.var === variable);
      if (!vars.includes(variable)) {
        throw new PcalError(`Assignment to undeclared variable ${variable}`, group[0]);
      }
      const hasAssignmentWithNoSubscript = group.some(
        (single) => single.lhs.sub.tokens.length === 0,
      );
      if (
        setChanged(thisChanged, variable) > 1 ||
        (group.length > 1 && hasAssignmentWithNoSubscript)
      ) {
        throw new PcalError(`Multiple assignment to ${variable}`, assign);
      }
    });
    mergeChanged(changed, thisChanged);
  };

  const checkStmt = (stmt: PcalStmt, changed: number[]): void => {
    switch (stmt.kind) {
      case "Assign":
        checkAssign(stmt, changed);
        return;
      case "If": {
        const thenChanged = [...changed];
        const elseChanged = [...changed];
        stmt.Then.forEach((innerStmt) => checkStmt(innerStmt, thenChanged));
        stmt.Else.forEach((innerStmt) => checkStmt(innerStmt, elseChanged));
        mergeChanged(changed, thenChanged);
        mergeChanged(changed, elseChanged);
        return;
      }
      case "Either": {
        const allChanged = [...changed];
        stmt.ors.forEach((orStmts) => {
          const orChanged = [...changed];
          orStmts.forEach((innerStmt) => checkStmt(innerStmt, orChanged));
          mergeChanged(allChanged, orChanged);
        });
        mergeChanged(changed, allChanged);
        return;
      }
      case "With":
        stmt.Do.forEach((innerStmt) => checkStmt(innerStmt, changed));
        return;
      case "When":
      case "PrintS":
      case "Assert":
      case "Skip":
        return;
      default:
        throw new PcalBugError(`Unexpected AST type ${stmt.kind}`);
    }
  };

  const checkBody = (body: PcalStmt[]) =>
    body.forEach((stmt) => {
      const changed = vars.map(() => 0);
      toLabeledStmt(stmt).stmts.forEach((innerStmt) => checkStmt(innerStmt, changed));
    });

  explodedAst.prcds.forEach((procedure) => checkBody(procedure.body));
  (explodedAst.kind === "Uniprocess"
    ? [explodedAst.body]
    : explodedAst.procs.map((process) => process.body)
  ).forEach(checkBody);
};

export const translatePcalAlgorithm = (
  ast: PcalAlgorithm,
  shouldOmitPC: boolean,
  hasDefaultInitialization: boolean,
  log: (line: string) => void,
) => {
  const table = createPcalSymbolTable(ast);
  if (disambiguatePcalSymbols(table)) log("Warning: symbols were renamed.");
  fixPcalIds(ast, table, log);
  checkPcalTlaGen(explodePcalAlgorithm(ast, table, shouldOmitPC), shouldOmitPC);
  if (hasDefaultInitialization) checkForDefaultInitValue(table);
};
