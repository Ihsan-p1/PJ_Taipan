const monitoring = {
  errors: [],
  operations: [],

  logOperation(type, details) {
    this.operations.push({
      type,
      details,
      timestamp: new Date(),
    });
    console.log(`Operation logged: ${type}`, details);
  },

  logError(error, context) {
    this.errors.push({
      error,
      context,
      timestamp: new Date(),
    });
    console.error(`Error logged in ${context}:`, error);
  },

  getReport() {
    return {
      errors: this.errors,
      operations: this.operations,
      summary: {
        totalErrors: this.errors.length,
        totalOperations: this.operations.length,
        errorRate: this.errors.length / this.operations.length,
      },
    };
  },
};
