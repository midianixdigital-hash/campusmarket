import fs from "fs/promises";
import path from "path";

const filePath = path.join(process.cwd(), "data", "universidades.json");

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const body = req.body;

      // lê arquivo atual
      const fileData = await fs.readFile(filePath, "utf-8");
      const registros = JSON.parse(fileData || "[]");

      // adiciona novo registro com timestamp
      const novo = {
        ...body,
        criadoEm: new Date().toISOString(),
      };

      registros.push(novo);

      // grava no arquivo
      await fs.writeFile(filePath, JSON.stringify(registros, null, 2), "utf-8");

      return res.status(201).json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ ok: false, error: "Erro ao guardar dados" });
    }
  }

  if (req.method === "GET") {
    const fileData = await fs.readFile(filePath, "utf-8");
    const registros = JSON.parse(fileData || "[]");
    return res.status(200).json(registros);
  }

  return res.status(405).json({ message: "Método não permitido" });
}
